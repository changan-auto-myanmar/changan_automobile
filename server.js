import Db from "./configs/db.config.js";
import app from "./app.js";

Db();

const port = process.env.PORT || 5500;

const server = app.listen(port, () => {
  console.log(`SERVER is Running at PORT:${port}`);
});
