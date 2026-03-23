import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler';
import { authRouter } from './routes/auth';
import { saloesRouter } from './routes/saloes';
import { congregacoesRouter } from './routes/congregacoes';
import { pessoasRouter } from './routes/pessoas';
import { elementosRouter } from './routes/elementos';
import { equipamentosRouter } from './routes/equipamentos';
import { avaliacoesRouter } from './routes/avaliacoes';
import { visitasRouter } from './routes/visitas';
import { pendenciasRouter } from './routes/pendencias';
import { servicosRouter } from './routes/servicos';
import { incidentesRouter } from './routes/incidentes';
import { cronogramaRouter } from './routes/cronograma';
import { financeiroRouter } from './routes/financeiro';
import { dashboardRouter } from './routes/dashboard';
import { usuariosRouter } from './routes/usuarios';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/saloes', saloesRouter);
app.use('/api/congregacoes', congregacoesRouter);
app.use('/api/pessoas', pessoasRouter);
app.use('/api/elementos', elementosRouter);
app.use('/api/equipamentos', equipamentosRouter);
app.use('/api/avaliacoes', avaliacoesRouter);
app.use('/api/visitas', visitasRouter);
app.use('/api/pendencias', pendenciasRouter);
app.use('/api/servicos', servicosRouter);
app.use('/api/incidentes', incidentesRouter);
app.use('/api/cronograma', cronogramaRouter);
app.use('/api/financeiro', financeiroRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/usuarios', usuariosRouter);

app.use(errorHandler);

export { app };
