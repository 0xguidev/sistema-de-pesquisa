import { Entity } from "src/core/entities/entity"
import { UniqueEntityID } from "src/core/entities/unique-entity-id"


export interface AccountProps {
  name: string
  email: string
  password: string
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

  static create(props: AccountProps, id?: UniqueEntityID) {
    const account = new Account(props, id)

    return account
  }
}
