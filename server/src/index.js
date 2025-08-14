import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ingestRouter from './routes/ingest.js';
import queryRouter from './routes/query.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/ingest', ingestRouter);
app.use('/query', queryRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
