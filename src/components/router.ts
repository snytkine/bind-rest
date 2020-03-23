import {HttpRouter} from 'holiday-router';
import { IControllerContainer } from 'holiday-router';
import {Component, Singleton} from 'bind';
import FrameworkController from '../lib/core/frameworkcontroller';

@Component
@Singleton
export default class Router extends HttpRouter<FrameworkController> {}
