import Context from '../../components/context';
import {IfIocContainer} from 'bind';

export type FutureParam = (context: Context) => Promise<any>;
export type ParamExtractor = FutureParam;
export type ParamExtractorFactory = (container: IfIocContainer) => ParamExtractor;
