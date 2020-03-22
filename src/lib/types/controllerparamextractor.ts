import Context from '../core/context';
import {IfIocContainer} from 'bind';

export type ParamExtractor = (context: Context) => Promise<any>
export type ParamExtractorFactory = (container: IfIocContainer) => ParamExtractor
