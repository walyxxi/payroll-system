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

export const getPayslipDetails = async (userId, attendancePeriodId) => {
  const period = await prisma.attendancePeriod.findUnique({ where: { id: attendancePeriodId } });
  const payroll = await prisma.payroll.findUnique({ where: { attendancePeriodId } });
  if (!period || !payroll) throw new Error('Payroll or period not found.');

  const payslip = await prisma.payslip.findFirst({
    where: { userId, payrollId: payroll.id },
  });
  if (!payslip) throw new Error('Payslip not found.');

  const workingDays = getWorkingDays(period.startDate, period.endDate);

  // Reimbursements
  const reimbursements = await prisma.reimbursement.findMany({
    where: {
      userId,
      createdAt: { gte: period.startDate, lte: period.endDate },
    },
  });

  return {
    attendance: payslip.attendance,
    overtime: payslip.overtime,
    reimbursements: reimbursements.map(({ amount, description }) => ({ amount, description })),
    totalPay: payslip.totalPay,
    workingDays,
    attendanceDays: payslip.attendance / (payslip.attendance / workingDays || 1),
  };
};