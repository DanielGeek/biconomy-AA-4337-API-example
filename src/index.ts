import express from 'express';
import bodyParser from 'body-parser';
import { handleUserOperation } from './bundler';

const app = express();
app.use(bodyParser.json());

app.post('/api/sendUserOp', handleUserOperation);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
