import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/** Entry point: bootstraps the standalone root component `App`. */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
