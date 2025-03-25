import pakistanFlag from '@assets/flags/pak.svg';

export const COUNTRIES: readonly {
  readonly code: string;
  readonly path: string;
  readonly name: string;
  readonly flag?: ImageMetadata;
  readonly languages: readonly {
    readonly code: string;
    readonly name: string;
  }[];
}[] = [
  {
    code: 'PAK',
    path: 'pak',
    name: 'Pakistan',
    flag: pakistanFlag,
    languages: [
      { code: 'ur', name: 'اردو' },
      { code: 'en', name: 'English' },
    ],
  },
  {
    code: 'UAE',
    path: 'uae',
    name: 'UAE',
    // flag: '🇦🇪',
    languages: [
      { code: 'ar', name: 'العربية' },
      { code: 'en', name: 'English' },
    ],
  },
  // Add more countries as needed
];
