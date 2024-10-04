import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const routes = (api) => {
  api.get('/status', (req, res) => AppController.getStatus(req, res));
  api.get('/stats', (req, res) => AppController.getStats(req, res));
  api.post('/users', (req, res) => UsersController.PostNew(req, res));
  api.get('/connect', (req, res) => AuthController.getConnect(req, res));
  api.get('/disconnect', (req, res) => AuthController.getDisconnect(req, res));
  api.get('/users/me', (req, res) => UsersController.getMe(req, res));
  api.post('/files', (req, res) => FilesController.postUpload(req, res));
  api.get('/files/:id', (req, res) => FilesController.getShow(req, res));
  api.get('/files/', (req, res) => FilesController.getIndex(req, res));
  api.put('/files/:id/publish', (req, res) => FilesController.putPublish(req, res));
  api.put('/files/:id/unpublish', (req, res) => FilesController.putUnpublish(req, res));
  api.get('/files/:id/data', (req, res) => FilesController.getFile(req, res));
};

export default routes;
