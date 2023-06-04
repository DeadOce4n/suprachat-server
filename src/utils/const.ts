import { Type } from '@sinclair/typebox'

export const MONGO_URI = process.env.MONGO_URI
export const DB_NAME = process.env.DB_NAME
export const IRCD_HOST = process.env.IRCD_HOST
export const IRCD_PORT = Number(process.env.IRCD_PORT)
export const WEBIRC_PASS = process.env.WEBIRC_PASS
export const PORT = Number(process.env.PORT)
export const SECRET_KEY = process.env.SECRET_KEY
export const LOG_LEVEL = process.env.LOG_LEVEL
export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '').split(',')
export const { S3_SECRET_KEY, S3_ACCESS_KEY, S3_REGION, S3_BUCKET_NAME } =
  process.env
export const { VERCEL_API_URL, VERCEL_ACCESS_TOKEN, VERCEL_PROJECT_ID } =
  process.env

export const FORBIDDEN_CHARS = ' ,*?.!:<>\'";#~&@%+-'.split('')

export const countries = [
  'Albania',
  'Alemania',
  'Andorra',
  'Angola',
  'Antigua y Barbuda',
  'Arabia Saudita',
  'Argelia',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaiyán',
  'Bahamas',
  'Bahrein',
  'Bangladesh',
  'Barbados',
  'Belarús',
  'Belice',
  'Benin',
  'Bhután',
  'Bolivia',
  'Bosnia y Herzegovina',
  'Botswana',
  'Brasil',
  'Brunei Darussalam',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Bélgica',
  'Cabo Verde',
  'Camboya',
  'Camerún',
  'Canadá',
  'Chad',
  'Chequia',
  'Chile',
  'China',
  'Chipre',
  'Colombia',
  'Comoras',
  'Congo',
  'Corea del Norte',
  'Corea del Sur',
  'Costa Rica',
  'Croacia',
  'Cuba',
  "Côte d'Ivoire",
  'Dinamarca',
  'Djibouti',
  'Dominica',
  'Ecuador',
  'Egipto',
  'El Salvador',
  'Emiratos Árabes Unidos',
  'Eritrea',
  'Eslovaquia',
  'Eslovenia',
  'España',
  'Estados Unidos',
  'Estonia',
  'Eswatini',
  'Etiopía',
  'Fiji',
  'Filipinas',
  'Finlandia',
  'Francia',
  'Gabón',
  'Gambia',
  'Georgia',
  'Ghana',
  'Granada',
  'Grecia',
  'Guatemala',
  'Guinea',
  'Guinea Ecuatorial',
  'Guinea-Bissau',
  'Guyana',
  'Haití',
  'Honduras',
  'Hungría',
  'India',
  'Indonesia',
  'Iraq',
  'Irlanda',
  'Irán',
  'Islandia',
  'Islas Cook',
  'Islas Feroe',
  'Islas Marshall',
  'Islas Salomón',
  'Israel',
  'Italia',
  'Jamaica',
  'Japón',
  'Jordania',
  'Kazajstán',
  'Kenya',
  'Kirguistán',
  'Kiribati',
  'Kuwait',
  'Laos',
  'Lesotho',
  'Letonia',
  'Liberia',
  'Libia',
  'Lituania',
  'Luxemburgo',
  'Líbano',
  'Macedonia del Norte',
  'Madagascar',
  'Malasia',
  'Malawi',
  'Maldivas',
  'Malta',
  'Malí',
  'Marruecos',
  'Mauricio',
  'Mauritania',
  'Micronesia',
  'Mongolia',
  'Montenegro',
  'Mozambique',
  'Myanmar',
  'México',
  'Moldavia',
  'Mónaco',
  'Namibia',
  'Nauru',
  'Nepal',
  'Nicaragua',
  'Nigeria',
  'Niue',
  'Noruega',
  'Nueva Zelanda',
  'Níger',
  'Omán',
  'Pakistán',
  'Palau',
  'Panamá',
  'Papua Nueva Guinea',
  'Paraguay',
  'Países Bajos',
  'Perú',
  'Polonia',
  'Portugal',
  'Qatar',
  'Reino Unido',
  'República Centroafricana',
  'República Democrática del Congo',
  'República Dominicana',
  'Rumania',
  'Russia',
  'Rwanda',
  'Saint Kitts y Nevis',
  'Samoa',
  'San Marino',
  'San Vicente y las Granadinas',
  'Santa Lucía',
  'Santo Tomé y Príncipe',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leona',
  'Singapur',
  'Siria',
  'Somalia',
  'Sri Lanka',
  'Sudáfrica',
  'Sudán',
  'Sudán del Sur',
  'Suecia',
  'Suiza',
  'Surinam',
  'Tailandia',
  'Tanzania',
  'Tayikistán',
  'Timor-Leste',
  'Togo',
  'Tokelau',
  'Tonga',
  'Trinidad y Tabago',
  'Turkmenistán',
  'Turquía',
  'Tuvalu',
  'Túnez',
  'Ucrania',
  'Uganda',
  'Uruguay',
  'Uzbekistán',
  'Vanuatu',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
] as const

export const ObjectIdString = Type.String({ pattern: '^[0-9a-fA-F]{24}$' })

export enum Roles {
  Normal = 'normal',
  Admin = 'admin'
}

export const PROFILE_PIC_MAX_SIZE = Number(process.env.PROFILE_PIC_MAX_SIZE)

export const VERCEL_ENV_KEYS: Record<string, string> = {
  GATSBY_KIWI_URL: '6aH7glnqTjZKbrA8'
}

export const ALLOWED_IMG_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp'
]

export const OBJECTID_REGEX = '^[0-9a-fA-F]{24}$'
