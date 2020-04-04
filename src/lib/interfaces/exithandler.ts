export interface IExitHandler {
  onExit: (exitCode: number) => Promise<number>;
}
