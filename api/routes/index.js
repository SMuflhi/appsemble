import Router from 'koa-router';

import editorHandler from './editorHandler';
import faviconHandler from './faviconHandler';
import iconHandler from './iconHandler';
import indexHandler from './indexHandler';
import manifestHandler from './manifestHandler';


const router = new Router();
router.get('/editor/(.*)?', editorHandler);
router.get('/:id(\\d+)?/favicon.ico', faviconHandler);
router.get('/:id(\\d+)/manifest.json', manifestHandler);
router.get('/:id(\\d+)/icon-:size(\\d+).png', iconHandler);
router.get('/:id(\\d+)/(.*)?', indexHandler);


export default router.routes();
