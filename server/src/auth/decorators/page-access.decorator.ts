import { SetMetadata } from '@nestjs/common';

export const PAGE_ACCESS_KEY = 'pageAccessKey';
export const RequirePageAccess = (pageKey: string) => SetMetadata(PAGE_ACCESS_KEY, pageKey);
