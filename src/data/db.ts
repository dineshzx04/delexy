import Dexie, { type Table } from 'dexie';
import type {
  User,
  PlatformPermission,
  PlatformRole,
  PlatformRolePermission,
  UserPlatformRole,
  Business,
  BusinessPermission,
  BusinessRole,
  BusinessRolePermission,
  UserCredential,
  BusinessMembership,
  Address,
  Attribute,
  AttributeValue,
  AttributeGroup,
  Category,
  RFQ,
  UserProduct,
  CategoryProduct,
} from './schemas';

export * from './schemas';

export type PlatformProduct = CategoryProduct;
export type UserProductReview = any;
export type FieldReview = any;
export type FieldReviewStatus = any;

export class AppDatabase extends Dexie {
  users!: Table<User, string>;
  platformPermissions!: Table<PlatformPermission, string>;
  platformRoles!: Table<PlatformRole, string>;
  platformRolePermissions!: Table<PlatformRolePermission, [string, string]>;
  userPlatformRoles!: Table<UserPlatformRole, [string, string]>;
  businesses!: Table<Business, string>;
  businessPermissions!: Table<BusinessPermission, string>;
  businessRoles!: Table<BusinessRole, string>;
  businessRolePermissions!: Table<BusinessRolePermission, [string, string]>;
  userCredentials!: Table<UserCredential, string>;
  businessMemberships!: Table<BusinessMembership, string>;
  addresses!: Table<Address, string>;
  attributes!: Table<Attribute, string>;
  attributeValues!: Table<AttributeValue, string>;
  attributeGroups!: Table<AttributeGroup, string>;
  categories!: Table<Category, string>;
  rfqs!: Table<RFQ, string>;
  userProducts!: Table<UserProduct, string>;
  userProductReviews!: Table<any, string>;
  platformProducts!: Table<CategoryProduct, string>;
  categoryProducts!: Table<CategoryProduct, string>;

  constructor() {
    super('DelexyAppDB');
    this.version(1).stores({
      users: 'id, national_id_hash, primary_phone_e164, country_of_residence, is_platform_active',
      platformPermissions: 'id, code',
      platformRoles: 'id, name',
      platformRolePermissions: '[role_id+permission_id]',
      userPlatformRoles: '[user_id+role_id], user_id',
      businesses: 'id, slug, registration_number, country_of_incorporation',
      businessPermissions: 'id, code',
      businessRoles: 'id, business_id, name',
      businessRolePermissions: '[role_id+permission_id]',
      userCredentials: 'id, user_id, email',
      businessMemberships: 'id, business_id, user_id, credential_id, role_id, status',
      addresses: 'id, entity_type, entity_id, country_iso3',
      attributes: 'id, code, type',
      attributeValues: 'id, attributeId, code',
      attributeGroups: 'id, code',
      categories: 'id, code, parentId',
      rfqs: 'id, rfqNumber, buyerUserId, buyerBusinessId, status',
      userProducts: 'id, userId, categoryId, status',
      userProductReviews: 'id, productId',
      platformProducts: 'id, categoryId',
      categoryProducts: 'id, categoryId',
    });
  }
}

export const db = new AppDatabase();
