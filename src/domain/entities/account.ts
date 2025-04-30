import { Entity } from 'src/core/entities/entity'
import { UniqueEntityID } from 'src/core/entities/unique-entity-id'
import { Slug } from './value-objects/slug'
import { Optional } from '@/core/types/optional'

export interface AccountProps {
  name: string
  email: string
  password: string
  slug: Slug
}

export class Account extends Entity<AccountProps> {
  get name() {
    return this.props.name
  }

  get email() {
    return this.props.email
  }

  get password() {
    return this.props.password
  }

  get slug() {
    return this.props.slug
  }

  static create(props: Optional<AccountProps, 'slug'>, id?: UniqueEntityID) {
    const account = new Account(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.email),
      },
      id,
    )

    return account
  }
}
