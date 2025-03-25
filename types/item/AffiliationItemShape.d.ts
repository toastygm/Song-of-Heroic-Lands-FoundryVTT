export interface AffiliationItemShape {
    society: string;
    office: string;
    title: string;
    level: number;
    parent?: { update?: (data: any) => unknown };
}
