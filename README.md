Rollout Extension
-----------------

The project introduces the Argo Rollout dashboard into the Argo CD Web UI.

![image](https://user-images.githubusercontent.com/426437/136460261-00d3dc31-ad20-4044-a7be-091803b8678f.png)

# Quick Start

- Install Argo CD and Argo CD Extensions Controller: https://github.com/argoproj-labs/argocd-extensions
- Create `argo-rollouts` extension in `argocd` namespace

```
kubectl apply -n argocd \
    -f https://raw.githubusercontent.com/argoproj-labs/rollout-extension/master/manifests/install.yaml
```

