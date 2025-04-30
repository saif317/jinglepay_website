import PakistanFlag from '@assets/flags/pak.svg';
import UaeFlag from '@assets/flags/uae.svg';
import BhrFlag from '@assets/flags/bhr.svg';

export const COUNTRIES: readonly {
  readonly code: string;
  readonly path: string;
  readonly name: string;
  readonly flag?: AstroSVGElement;
  readonly languages: readonly {
    readonly code: string;
    readonly name: string;
  }[];
}[] = [
  {
    code: 'PAK',
    path: 'pak',
    name: 'Pakistan',
    flag: PakistanFlag,
    languages: [
      { code: 'ur', name: 'اردو' },
      { code: 'en', name: 'English' },
    ],
  },
  {
    code: 'UAE',
    path: 'uae',
    name: 'UAE',
    flag: UaeFlag,
    languages: [
      { code: 'ar', name: 'العربية' },
      { code: 'en', name: 'English' },
    ],
  },
  {
    code: 'BHR',
    path: 'bhr',
    name: 'Bahrain',
    flag: BhrFlag,
    languages: [
      { code: 'ar', name: 'العربية' },
      { code: 'en', name: 'English' },
    ],
  },
];
