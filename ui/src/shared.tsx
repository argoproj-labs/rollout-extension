import { ObjectMeta, TypeMeta } from "argo-ui/src/models";

export type State = TypeMeta & { metadata: ObjectMeta } & {
  status: any;
  spec: any;
};

// tslint:disable-next-line:no-empty-interface
export interface ApplicationResourceTree { }