# Rollout Extension

The project introduces the Argo Rollout dashboard into the Argo CD Web UI.

![image](https://user-images.githubusercontent.com/426437/136460261-00d3dc31-ad20-4044-a7be-091803b8678f.png)

## Compatibility

Starting with `v0.4.0`, this extension requires **Argo CD v3.5 or later**. For Argo CD versions earlier than v3.5, use extension version `v0.3.x`.

| Rollout Extension | Argo CD       |
| ----------------- | ------------- |
| `v0.4.0`+         | `v3.5`+       |
| `v0.3.x`          | `< v3.5`      |

## Install UI extension

To install the extension use the [argocd-extension-installer](https://github.com/argoproj-labs/argocd-extension-installer) init container which runs during the startup of the argocd server.
The init container downloads and extracts the JS file to `/tmp/extensions`. The argocd interface mounts the external JS file within the rollout resource.

The examples below install `v0.4.1`, which requires Argo CD v3.5 or later. On an earlier Argo CD version, replace `v0.4.1` in `EXTENSION_URL` with `v0.3.7`, the last `v0.3.x` release (see [Compatibility](#compatibility)).


### Kustomize Patch

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: argocd-server
spec:
  template:
    spec:
      initContainers:
        - name: rollout-extension
          image: quay.io/argoprojlabs/argocd-extension-installer:v0.0.8
          env:
          - name: EXTENSION_URL
            value: https://github.com/argoproj-labs/rollout-extension/releases/download/v0.4.1/extension.tar
          volumeMounts:
            - name: extensions
              mountPath: /tmp/extensions/
          securityContext:
            runAsUser: 1000
            allowPrivilegeEscalation: false
      containers:
        - name: argocd-server
          volumeMounts:
            - name: extensions
              mountPath: /tmp/extensions/
      volumes:
        - name: extensions
          emptyDir: {}
```

### Helm Values

#### Using `server.extensions`

```yaml
server:
  extensions:
    enabled: true
    extensionList:
      - name: rollout-extension
        env:
          - name: EXTENSION_URL
            value: https://github.com/argoproj-labs/rollout-extension/releases/download/v0.4.1/extension.tar
```

#### Using `server.initContainers`, `server.volumeMounts`, and `server.volumes` directly

```yaml
server:
  initContainers:
    - name: rollout-extension
      image: quay.io/argoprojlabs/argocd-extension-installer:v0.0.8
      env:
      - name: EXTENSION_URL
        value: https://github.com/argoproj-labs/rollout-extension/releases/download/v0.4.1/extension.tar
      volumeMounts:
        - name: extensions
          mountPath: /tmp/extensions/
      securityContext:
        runAsUser: 1000
        allowPrivilegeEscalation: false
  volumeMounts:
    - name: extensions
      mountPath: /tmp/extensions/
  volumes:
    - name: extensions
      emptyDir: {}
```
