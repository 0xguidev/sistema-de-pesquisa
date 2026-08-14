import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Optional } from '@/core/types/optional'

export interface AccountProps {
  name: string
  email: string
  password: string
  slug: Slug
  role: AccountRole
}

export const ACCOUNT_ROLES = ['USER', 'ADMIN'] as const
export type AccountRole = (typeof ACCOUNT_ROLES)[number]

export class Account extends Entity<AccountProps> {
  get name() {
    return this.props.name
  }

  set name(name: string) {
    this.props.name = name
  }

  get email() {
    return this.props.email
  }

  set email(email: string) {
    this.props.email = email
    this.props.slug = Slug.createFromText(email)
  }

  get password() {
    return this.props.password
  }

  set password(password: string) {
    this.props.password = password
  }

  get slug() {
    return this.props.slug
  }

  get role() {
    return this.props.role
  }

  static create(
    props: Optional<AccountProps, 'slug' | 'role'>,
    id?: UniqueEntityID,
  ) {
    const account = new Account(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.email),
        role: props.role ?? 'USER',
      },
      id,
    )

    return account
  }
}
