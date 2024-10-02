import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const routes = (api) => {
  api.get('/status', AppController.getStatus);
  api.get('/stats', AppController.getStats);
  api.post('/users', UsersController.PostNew);
  api.get('/connect', AuthController.getConnect);
  api.get('/disconnect', AuthController.getDisconnect);
  api.get('/users/me', UsersController.getMe);
  api.post('/files', FilesController.postUpload);
  api.get('/files/:id', FilesController.getShow);
  api.get('/files/', FilesController.getIndex);
  api.put('/files/:id/publish', FilesController.putPublish);
  api.put('/files/:id/unpublish', FilesController.putUnpublish);
  api.get('/files/:id/data', FilesController.getFile);
};

export default routes;
