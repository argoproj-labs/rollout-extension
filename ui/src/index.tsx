import './dark.css'
import { RolloutExtension } from './components/Rollout';
import { AnalysisRunExtension } from './components/AnalysisRun';


// export const AnalysisRunExtension = (props: {application: any; tree: ApplicationResourceTree; resource: State}) => {
//     const ro = parseInfoFromResourceNode(props.application, props.tree, props.resource);
//     return <RolloutAnalysisRunWidget rollout={ro} />;
// };


((window: any) => {
    window?.extensionsAPI?.registerResourceExtension(RolloutExtension, 'argoproj.io', 'Rollout', 'Rollout', {icon: 'fa-sharp fa-light fa-bars-progress fa-lg'});
    window?.extensionsAPI?.registerResourceExtension(AnalysisRunExtension, 'argoproj.io', 'AnalysisRun', 'Rollout Analysis', {icon: 'fa-sharp fa-light fa-bars-progress fa-lg'});
})(window);
