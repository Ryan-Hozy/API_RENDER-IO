const express = require("express");
const path = require("path");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();
const { DATABASE_URL } = process.env;

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:5173",
      "https://photography-booking-system-v2.vercel.app",
    ];
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions)); // Enable CORS with options
app.use(express.json());

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.post("/booking", async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, contact, date, message, user_id } = req.body;

    console.log("Received data:", {
      name,
      email,
      contact,
      date,
      message,
      user_id,
    });

    const query =
      "INSERT INTO booking (name, email, contact, date, message, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";
    const params = [name, email, contact, date, message, user_id];
    const result = await client.query(query, params);

    const data = {
      id: result.rows[0].id,
      name,
      email,
      contact,
      date,
      message,
      user_id,
    };

    console.log(`Booking created successfully with id ${data.id}`);
    res.json({
      status: "success",
      data,
      message: "Booking created successfully",
    });
  } catch (error) {
    console.error("Error: ", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get("/booking/:user_id", async (req, res) => {
  const client = await pool.connect();
  const { user_id } = req.params; // Extract user_id from route parameters

  try {
    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const query = "SELECT * FROM booking WHERE user_id = $1";
    const result = await client.query(query, [user_id]);
    res.json(result.rows);
  } catch (err) {
    console.log(err.stack);
    res.status(500).send("An error occurred");
  } finally {
    client.release();
  }
});

app.put("/booking/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;
  const client = await pool.connect();
  try {
    console.log("Received data for updating booking:", updatedData); // Log received data

    const updateQuery =
      "UPDATE booking SET name = $1, email = $2, contact = $3, date = $4, message = $5 WHERE id = $6 RETURNING *";
    const queryData = [
      updatedData.name,
      updatedData.email,
      updatedData.contact,
      updatedData.date,
      updatedData.message,
      id,
    ];
    console.log("Executing query with data:", queryData); // Log query data

    const result = await client.query(updateQuery, queryData);
    console.log("Query result:", result.rows[0]); // Log query result

    res.json({
      status: "success",
      message: "Post updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.delete("/booking/:id", async (req, res) => {
  const id = req.params.id;
  const client = await pool.connect();

  try {
    const deleteQuery = "DELETE FROM booking WHERE id = $1";
    await client.query(deleteQuery, [id]);

    res.json({ status: "success", message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

app.get('/', (req, res) => {
  res.status(200).json({ message: "Welcome to the booking API"});
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
