# Payroll System API

This project is a RESTful API for managing payroll, attendance, overtime, reimbursement, and related HR processes. The API documentation is powered by [OpenAPI (Swagger)](https://swagger.io/specification/) and is accessible through Swagger UI.

---

## Features

- **User Authentication:** Secure login system using JWT tokens.
- **Attendance Management:** Record and view employee attendance.
- **Overtime Tracking:** Submit and review overtime requests.
- **Reimbursement:** Manage employee reimbursement submissions.
- **Payroll:** Run and manage payroll for defined periods.
- **API Documentation:** Interactive docs available at `/api-docs`.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or above recommended)
- npm

---

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/payroll-system.git
   cd payroll-system
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Copy the example environment file to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` in your favorite editor and adjust the values as needed:
     - `PORT`: The port your app will run on (default: 3000)
     - `JWT_SECRET`: Secret key for JWT token signing
     - `DB_URL` or similar: Your database connection string
     - Any additional keys specific to your environment

4. **Run database migrations (if applicable):**

   - If your project uses migrations, apply them here:
     ```bash
     npm run migrate
     ```
   - _Skip this step if not applicable._

5. **Run the server:**
   ```bash
   npm start
   ```
   The server will start, usually on [http://localhost:3000](http://localhost:3000).

---

## API Documentation

- Once the server is running, visit [http://localhost:3000/api-docs](http://localhost:3000/api-docs) in your browser.
- Use the "Authorize" button to enter your JWT token after login to access protected endpoints.
- The documentation is generated from the OpenAPI YAML files in `src/docs/`.

---

## Project Structure

```
prisma/           # Contains Prisma schema and migration files
src/              # Application source code
  docs/           # OpenAPI YAML files (e.g., index.yaml, auth.yaml)
  controllers/    # Business logic for handling requests
  middleware/     # Express middleware functions
  routes/         # Express route handlers
  utils/          # Utility/helper functions
  validation/     # Joi validation for request body/params/query
  app.js          # Express app entry point
  server.js       # Express server startup script
tests/            # Automated and manual test cases
.env.example      # Example environment variable file
.gitignore        # Ignore files and folders that should not be committed to the repository
package.json
README.md
```

---

## OpenAPI Specification

- The main OpenAPI file is at `src/docs/index.yaml`.
- You can split API docs by feature (attendance, payroll, etc.) and merge them as needed.
- All routes except `/api/auth/login` require authentication via JWT bearer tokens.
- After logging in, use the JWT token as a Bearer token in the Authorization header for all subsequent requests.

---

## Environment Variables

The `.env` file contains configuration values for your environment.  
**To set it up:**

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and provide values for necessary keys, such as:
   - `PORT=3000`
   - `JWT_SECRET=your_jwt_secret`
   - `DB_URL=your_database_url`
   - (add any other required keys)

---

---

## How to Access API Documentation

To view and interact with the API documentation:

1. **Open your browser**  
   Go to: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)  
   _(Replace `3000` with your port if different)_

2. **Interact with the docs**
   - Use the "Authorize" button to set your JWT token after logging in.
   - You can try out all endpoints directly from the Swagger UI.

## Contributing

Contributions are welcome! Please fork the repo and submit a pull request.

---

## License

MIT License

---
