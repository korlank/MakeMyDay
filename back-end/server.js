require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./db/db");

//App Config
const app = express();
const port = process.env.PORT || 8080;

//Middleware
app.use(express.json());
app.use(cors());

//DB Config

//API Endpoints
app.get("/", (req, res) => {
  res.status(200).send("connection is made");
});

app.get("/api/users", (req, res) => {
  pool
    .query("SELECT * FROM users")
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      res.status(500).send(err.message);
      pool.end();
    });
});

app.get("/api/projects", (req, res) => {
  const query = `
    SELECT
      Projects.id,
      Projects.name,
      Projects.description,
      Projects.status,
      Projects.start_date,
      Projects.due_date,
      Projects.modified_date,
      Projects.end_date,
      array_agg(DISTINCT user_projects.user_id) AS users
    FROM projects
    JOIN user_projects ON projects.id = project_id
    GROUP BY projects.id
  `;
  pool
    .query(query)
    .then((result) => {
      res.json(result.rows);
    })
    .catch((err) => {
      res.status(500).send(err.message);
      pool.end();
    });
});

app.post(`/api/projects`, (req, res) => {
  const { name, description, status, users, start_date, due_Date } = req.body;
  const query = `
    INSERT INTO projects (name, description, status, start_date,  due_date)
    VALUES ($1, $2, $3, $4, $5) RETURNING *
  `;
  pool
    .query(query, [name, description, status, start_date, due_Date])
    .then((result) => {
      users.forEach((id) => {
        pool
          .query(
            `
          INSERT INTO user_projects (project_id, user_id)
          VALUES ($1, $2) RETURNING *
        `,
            [result.rows[0].id, id]
          )
          .then((result) => res.json(result.rows))
          .catch((err) => console.log("error2", err.message));
      });
    })
    .catch((err) => console.log("error", err.message));
});

app.get(`/api/projects/:id`, (req, res) => {
  const projectId = req.params.id;
  pool
    .query(`SELECT * FROM projects WHERE id = $1`, [projectId])
    .then((result) => res.json(result.rows))
    .catch((err) => console.log("could not get", err.message));
});

app.get(`/api/user_projects/:id`, (req, res) => {
  const projectId = req.params.id;
  pool
    .query(`SELECT * FROM user_projects WHERE project_id = $1`, [projectId])
    .then((result) => res.json(result.rows))
    .catch((err) => console.log("could not get", err.message));
});

app.put(`/api/projects/:id`, (req, res) => {
  const projectId = req.params.id;
  const { name, description, status, users, modified_date, due_Date } =
    req.body;
  const query = `
    UPDATE projects 
    SET name = $1, description = $2, status = $3, modified_date = $4,  due_date = $5
    WHERE id = $6
    RETURNING *
  `;

  pool
    .query(query, [
      name,
      description,
      status,
      modified_date,
      due_Date,
      projectId,
    ])
    .then(() => {
      pool
        .query(
          `
        DELETE FROM user_projects WHERE project_id = $1`,
          [projectId]
        )
        .then(() => {
          users.forEach((id) => {
            pool
              .query(
                `
                INSERT INTO user_projects (project_id, user_id)
                VALUES ($1, $2) RETURNING *
              `,
                [projectId, id]
              )
              .then((result) => res.json(result.rows))
              .catch((err) => console.log("error2", err.message));
          });
        });
    })
    .catch((err) => console.log("could not update", err.message));
});

app.delete(`/api/projects/:id`, (req, res) => {
  const projectId = req.params.id;
  pool
    .query(`DELETE FROM projects WHERE id = $1 RETURNING *`, [projectId])
    .then((result) => res.json(result.rows[0]))
    .catch((err) => console.log("could not delete", err.message));
});

app.post("/api/users", async (req, res) => {
  try {
    const { first_name, last_name, email, password } = req.body;
    const newUser = await pool.query(
      "INSERT INTO users (first_name, last_name, email, password) VALUES($1, $2, $3, $4)",
      [first_name, last_name, email, password]
    );
    res.json(newUser);
  } catch (err) {
    console.error(err.message);
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { name, project_id } = req.body;
    console.log("name and project_id", name, project_id);
    const result = await pool.query(
      `INSERT INTO tasks (name, project_id) VALUES ($1, $2) RETURNING *`,
      [name, project_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await pool.query(
      "SELECT projects.name AS project_name, users.user_name, users.avatar, tasks.* FROM projects JOIN tasks ON tasks.project_id = projects.id LEFT JOIN users ON users.id = tasks.user_id"
    );
    res.json(tasks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err);
  }
});

app.put(`/api/projects/:project_id/tasks/:task_id`, (req, res) => {
  // param { project_id: '4', task_id: '26' }
  const { name, description, status, start, end, priority } = req.body;
  const taskId = req.params.task_id;
  const query = `
    UPDATE  tasks SET name = $1, description = $2, status = $3, start = $4, "end" = $5, priority = $6
    WHERE id = $7 RETURNING *
  `;
  pool
    .query(query, [name, description, status, start, end, priority, taskId])
    .then((result) => {
      console.log(result.rows[0]);
      res.json(result.rows[0]);
    })
    .catch((err) => console.log("could not edit", err.message));
});

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { start, end, status } = req.body;
    const id = Number(req.params.id);
    if (!status) {
      const result = await pool.query(
        `UPDATE tasks SET start = $1, "end"=$2 WHERE id = $3 RETURNING *`,
        [start, end, id]
      );
      res.json(result.rows);
    } else {
      const result = await pool.query(
        `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );
      res.json(result.rows);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTask = await pool.query(`DELETE FROM tasks WHERE id = $1`, [
      id,
    ]);
    res.json(deleteTask);
  } catch (err) {
    res.status(500).send(err);
  }
});

//Listener
app.listen(port, () => console.log(`listening on localhost:${port}`));
