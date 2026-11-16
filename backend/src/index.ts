import app from "./app";

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend teče na http://localhost:${PORT}`);
});
