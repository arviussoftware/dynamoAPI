import sql, { ConnectionPool, config as SqlConfig } from 'mssql';

// Configure the database connection
const config: SqlConfig = {
  user: 'vsa',
  password: '!nd!@123', // replace with your actual password if not "vsa"
  server: '45.122.120.92',
  database: 'AmazonConnect',
  options: {
    encrypt: false, // Change to true if your SQL Server is hosted on Azure
    trustServerCertificate: true, // Change to false if your SQL Server uses a self-signed certificate
    enableArithAbort: true
  },
  pool: {
    max: 10, // Maximum number of connections
    min: 0,  // Minimum number of connections
    idleTimeoutMillis: 30000 // How long a connection is allowed to be idle before being closed
  }
};

// Create a connection pool
const poolPromise: Promise<ConnectionPool> = new sql.ConnectionPool(config)
  .connect()
  .then((pool: ConnectionPool) => {
    console.log('Connected to SQL Server');
    return pool;
  })
  .catch((err: Error) => { // Explicitly type the 'err' parameter
    console.error('Database connection failed:', err);
    process.exit(1);
  });

export { sql, poolPromise };
