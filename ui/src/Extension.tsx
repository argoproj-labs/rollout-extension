import React from "react";
import {
  Box,
  BoxTitle,
  CenteredRow,
  Filler,
  InfoItem,
  InfoItemKind,
  InfoItemRow,
  ThemeDiv,
} from "argo-ux";

import "./Extension.scss";

interface ApplicationResourceTree {}

interface Rollout {
  name: string;
}

const GetCurrentSetWeight = (spec: any, status: any) => {
  for (let i = status.currentStepIndex; i >= 0; i--) {
    const step = spec.strategy.canary.steps[i];
    if (step.setWeight) {
      return step.setWeight;
    }
  }
};

const GetReplicaSets = (tree: any, rollout: any) => {
  const allReplicaSets = [];
  const allPods = [];
  for (const node of tree.nodes) {
    if (node.kind === "ReplicaSet") {
      allReplicaSets.push(node);
    } else if (node.kind === "Pod") {
      allPods.push(node);
    }
  }

  const ownedReplicaSets: { [key: string]: any } = {};

  for (const rs of allReplicaSets) {
    for (const parentRef of rs.parentRefs) {
      if (parentRef.kind === "Rollout" && parentRef.name === rollout.name) {
        rs.pods = [];
        ownedReplicaSets[rs.name] = rs;
      }
    }
  }

  for (const pod of allPods) {
    for (const parentRef of pod.parentRefs) {
      const parent = ownedReplicaSets[parentRef.name];
      if (parentRef.kind === "ReplicaSet" && parent) {
        (parent.pods || []).push(pod);
      }
    }
  }

  return Object.values(ownedReplicaSets);
};

const ParseRevisionFromInfo = (replicaSet: any): number => {
  const infoItem = replicaSet.info.find((i: any) => i.name === "Revision");
  return parseInt(infoItem.value.replace("Rev:", ""), 10);
};

const GetRevisions = (replicaSets: any): any[] => {
  if (!replicaSets) {
    return;
  }
  const map: { [key: number]: any } = {};

  const emptyRevision = {
    replicaSets: [],
    experiments: [],
    analysisRuns: [],
  } as any;

  for (const rs of replicaSets || []) {
    const rev = ParseRevisionFromInfo(rs);
    if (!map[rev]) {
      map[rev] = { ...emptyRevision };
    }
    map[rev].number = rev;
    map[rev].replicaSets = [...map[rev].replicaSets, rs];
  }

  const revisions: any[] = [];
  const prevRn = 0;
  Object.keys(map).forEach((key) => {
    const rn = parseInt(key);
    if (rn > prevRn) {
      revisions.unshift(map[rn]);
    } else {
      revisions.push(map[rn]);
    }
  });

  return revisions;
};

const RevisionWidget = (props: { revision: any; current: boolean }) => {
  const { revision } = props;
  // const icon = collapsed ? faChevronCircleDown : faChevronCircleUp;
  // const images = parseImages(revision.replicaSets);

  return (
    <React.Fragment>
      <ThemeDiv className="revision__header">
        Revision {revision.number}
      </ThemeDiv>
      <ThemeDiv className="revision__images">
        {/* <ImageItems images={images} /> */}
      </ThemeDiv>
      <div>
        {revision.replicaSets?.map((rs: any, i: any) => {
          return (
            <ThemeDiv className="pods">
              {rs.name && (
                <ThemeDiv className="pods__header">
                  <span style={{ marginRight: "5px" }}>{rs.name}</span>{" "}
                  <div style={{ marginLeft: "auto" }}>
                    Revision {rs.revision}
                  </div>
                </ThemeDiv>
              )}

              {rs.pods && rs.pods.length > 0 && (
                <ThemeDiv className="pods__container">
                  {rs.pods.map((pod: any, i: number) => (
                    <div>
                      {pod.name} {i}
                    </div>
                  ))}
                </ThemeDiv>
              )}
            </ThemeDiv>
          );
        })}
      </div>
    </React.Fragment>
  );
};

const Containers = (props: { containers: any }) => {
  const { containers } = { ...props };
  return (
    <Box>
      <BoxTitle>Containers</BoxTitle>
      {(containers || []).map((container: any, i: number) => (
        <div
          style={{
            margin: "1em 0",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ paddingRight: "20px" }}>{container.name}</div>
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              height: "2em",
            }}
          >
            <InfoItem content={container.image} />
          </div>
        </div>
      ))}
      {containers.length < 2 && (
        <Filler>
          <span style={{ marginRight: "5px" }}></span>
          Add more containers to fill this space!
        </Filler>
      )}
    </Box>
  );
};

export const Extension = (props: {
  tree: ApplicationResourceTree;
  resource: Rollout;
  state: any;
}) => {
  const { resource, state, tree } = props as any;
  const { spec, status } = state;

  console.log(state);
  const replicaSets = GetReplicaSets(tree, resource);
  const revisions = GetRevisions(replicaSets);
  console.log(replicaSets);
  console.log(revisions);

  const strategy = spec.strategy.canary ? "Canary" : "BlueGreen";
  const currentStepIndex = status.currentStepIndex;
  const currentStep = spec.strategy.canary.steps[currentStepIndex];

  if (currentStep && status.availableReplicas > 0) {
    if (!spec.strategy.canary.trafficRouting) {
    } else {
    }
  }

  return (
    <React.Fragment>
      <CenteredRow>
        <Box>
          <BoxTitle>Summary</BoxTitle>

          <InfoItemRow
            items={{
              content: strategy,
              //   icon: iconForStrategy(rollout.strategy as Strategy),
              kind: strategy.toLowerCase() as InfoItemKind,
            }}
            label="Strategy"
          />
          <div>
            {strategy === "Canary" && (
              <React.Fragment>
                <InfoItemRow
                  items={{ content: currentStepIndex }}
                  label="Step"
                />
                <InfoItemRow
                  items={{
                    content: `${
                      currentStep ? GetCurrentSetWeight(spec, status) : 100
                    }`,
                  }}
                  label="Set Weight"
                />
                <InfoItemRow
                  items={{
                    content: "0",
                  }}
                  label="Actual Weight"
                />{" "}
              </React.Fragment>
            )}
          </div>
        </Box>
        <Containers containers={[]} />
      </CenteredRow>

      <CenteredRow>
        {replicaSets && replicaSets.length > 0 && (
          <Box>
            <BoxTitle>Revisions</BoxTitle>
            <div style={{ marginTop: "1em" }}>
              {revisions.map((r, i) => (
                <RevisionWidget key={i} revision={r} current={i === 0} />
              ))}
            </div>
          </Box>
        )}
        {(strategy || "").toLowerCase() === "canary" &&
          spec.strategy.canary.steps &&
          spec.strategy.canary.steps.length > 0 && (
            <Box>
              <BoxTitle>Steps</BoxTitle>
              <div style={{ marginTop: "1em" }}></div>
            </Box>
          )}
      </CenteredRow>
    </React.Fragment>
  );
};

export default Extension;
