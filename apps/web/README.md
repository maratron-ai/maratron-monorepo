This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Maratron Documentation (WIP)

## Database Setup and Access Documentation

This guide will help you set up your PostgreSQL database for our project.

### 1. Creating a SQL User and Database

1.1 Create a PostgreSQL User
Open your terminal and run the following command to create a new PostgreSQL user. Replace `maratron` and `yourpassword` with your preferred username and password:

```bash
createuser --interactive --pwprompt maratron
```

Alternatively, if you prefer to create a superuser (for development purposes):

```bash
createuser -s maratron
```

1.2 Create a Database
After creating the user, create a new database. Replace `maratrondb` with your desired database name:

```bash
createdb maratrondb -U maratron
```

This command creates a new database called `maratrondb` owned by the user `maratron`.

### 2. Setting Up the .env File

In your project root, create or update the `.env` or `.env.local` file with the following content:

```env
DATABASE_URL="postgresql://maratron:yourpassword@localhost:5432/maratrondb"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=yourSuperSecureSecret
```

- **maratron:** Your PostgreSQL username.
- **yourpassword:** The password you set for the PostgreSQL user.
- **localhost:** The database host (for local development).
- **5432:** The default PostgreSQL port.
- **maratrondb:** The database name you created.

### 3. Starting Up the Database

3.1 Start PostgreSQL Service
If you're using Homebrew on macOS, you can start the PostgreSQL service with the following command. (For PostgreSQL 15, for example):

```bash
brew services start postgresql@15
```

If you have a different version, specify the version accordingly.

3.2 Verify the Database Connection
To ensure that the database is running and accessible, you can connect to it via the terminal using `psql`:

```bash
psql -d maratrondb -U maratron
```

If the connection is successful, you will see a prompt like:

```
maratrondb=>
```

### 4. Accessing and Viewing the Database

4.1 Using the Terminal (psql)
Once connected with `psql`, you can run the following commands to interact with your database:

- **List Tables:**

  ```sql
  \dt
  ```

- **Query a Table (e.g., User):**

  ```sql
  SELECT * FROM "Users";
  ```

- **Exit psql:**

  ```sql
  \q
  ```

4.2 Using Prisma Studio (Recommended)
Prisma Studio is a web-based GUI that makes it easy to view and edit your database records.

1. In your project directory, run the following command:

   ```bash
   npx prisma studio
   ```

2. This command will open a new browser window where you can navigate your database tables and records.
