export type AvailableLocale = 'zh-cn' | 'en-us';

export interface LocaleContextValue {
  readonly locale: AvailableLocale;
  readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocale>>;
  readonly fetchingMessages: boolean;
}

export type LocalKey =
  | 'key0002'
  | 'key0003'
  | 'key0004'
  | 'key0005'
  | 'key0006'
  | 'key0007'
  | 'key0008'
  | 'key0009'
  | 'key0010'
  | 'key0011'
  | 'key0012'
  | 'key0013'
  | 'key0014'
  | 'key0015'
  | 'key0016'
  | 'key0017'
  | 'key0018'
  | 'key0019'
  | 'key0020'
  | 'key0021'
  | 'key0022'
  | 'key0023'
  | 'key0024'
  | 'key0025'
  | 'key0026'
  | 'key0027'
  | 'key0028';
