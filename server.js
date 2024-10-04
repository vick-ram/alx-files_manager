import express from 'express';
import routes from './routes';

const app = express();
const port = process.env.PORT || 5000;

routes(app);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
