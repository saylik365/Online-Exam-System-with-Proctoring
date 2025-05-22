declare const logger: {
  info: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  debug?: (...args: any[]) => void;
};

export = logger; 