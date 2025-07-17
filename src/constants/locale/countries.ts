import PakistanFlag from '@assets/flags/pak.svg';
import UaeFlag from '@assets/flags/uae.svg';
import BhrFlag from '@assets/flags/bhr.svg';

export type Country = {
  readonly code: string;
  readonly path: string;
  readonly name: string;
  readonly fullName: string;
  readonly flag: AstroSVGElement;
  readonly languages: readonly {
    readonly code: string;
    readonly name: string;
  }[];
};

export const COUNTRIES: readonly Country[] = [
  {
    code: 'ARE',
    path: 'are',
    name: 'UAE',
    fullName: 'UAE',
    flag: UaeFlag,
    languages: [
      { code: 'ar', name: 'عربي' },
      { code: 'en', name: 'English' },
    ],
  },
  {
    code: 'PAK',
    path: 'pak',
    name: 'PAK',
    fullName: 'Pakistan',
    flag: PakistanFlag,
    languages: [
      { code: 'ur', name: 'اردو' },
      { code: 'en', name: 'English' },
    ],
  },
  {
    code: 'BHR',
    path: 'bhr',
    name: 'BHR',
    fullName: 'Bahrain',
    flag: BhrFlag,
    languages: [
      { code: 'ar', name: 'العربية' },
      { code: 'en', name: 'English' },
    ],
  },
];
