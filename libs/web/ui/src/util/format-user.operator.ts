import { UserDetails } from '@planza/api-interfaces';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function formatUser() {
  return function (source: Observable<any>): Observable<UserDetails | null> {
    return source.pipe(
      map((data: any) => {
        if (data == null) {
          return null;
        } else {
          const { family_name, given_name, nickname, name, picture, updated_at, email, email_verified, sub } = data;
          return {
            role: data['https://planza.app/role'],
            userId: data['https://planza.app/userId'],
            org: data['https://planza.app/org'],
            family_name,
            given_name,
            nickname,
            name,
            picture,
            updated_at,
            email,
            email_verified,
            sub,
          } as UserDetails;
        }
      }),
    );
  };
}


