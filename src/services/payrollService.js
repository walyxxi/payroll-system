import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const getWorkingDays = (start, end) => {
  let count = 0;
  let d = new Date(start);
  end = new Date(end);
  while (d <= end) {
    if (d.getDay() > 0 && d.getDay() < 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

export const runPayroll = async (attendancePeriodId, runBy, ipAddress) => {
  // Ensure payroll for this period hasn't been run
  const existingPayroll = await prisma.payroll.findUnique({ where: { attendancePeriodId } });
  if (existingPayroll) throw new Error('Payroll already processed for this period.');

  // Get employees
  const employees = await prisma.user.findMany({ where: { role: 'employee' } });
  const period = await prisma.attendancePeriod.findUnique({ where: { id: attendancePeriodId } });
  if (!period) throw new Error('Attendance period not found.');

  // Count working days (Mon-Fri) in period
  const workingDays = getWorkingDays(period.startDate, period.endDate);

  // Payroll processing
  const payslips = [];
  for (const emp of employees) {
    // Attendance days in period
    const attendanceCount = await prisma.attendance.count({
      where: {
        userId: emp.id,
        date: { gte: period.startDate, lte: period.endDate },
      },
    });

    // Overtime hours in period
    const overtime = await prisma.overtime.aggregate({
      _sum: { hours: true },
      where: {
        userId: emp.id,
        date: { gte: period.startDate, lte: period.endDate },
      },
    });
    const overtimeHours = overtime._sum.hours || 0;

    // Reimbursements in period
    const reimbursements = await prisma.reimbursement.findMany({
      where: {
        userId: emp.id,
        createdAt: { gte: period.startDate, lte: period.endDate },
      },
    });
    const reimbursementTotal = reimbursements.reduce((sum, r) => sum + Number(r.amount), 0);

    // Prorated salary
    const monthlySalary = Number(emp.salary);
    const dailySalary = monthlySalary / workingDays;
    const attendanceSalary = dailySalary * attendanceCount;

    // Overtime pay (2x hourly rate)
    const hourlySalary = dailySalary / 8;
    const overtimePay = overtimeHours * hourlySalary * 2;

    // Total
    const totalPay = attendanceSalary + overtimePay + reimbursementTotal;

    payslips.push({
      userId: emp.id,
      attendance: attendanceSalary,
      overtime: overtimePay,
      reimbursements: reimbursementTotal,
      totalPay,
      createdBy: runBy,
      ipAddress,
    });
  }

  // Create payroll and payslips atomically
  return await prisma.$transaction(async (tx) => {
    const payroll = await tx.payroll.create({
      data: {
        attendancePeriodId,
        runBy,
        ipAddress,
        Payslip: { createMany: { data: payslips } },
      },
      include: { Payslip: true },
    });
    return payroll;
  });
};