export class CreateOAuthUserDto {
  email: string;
  displayName?: string;
  avatarUrl?: string;
  googleLinked: boolean;
}
