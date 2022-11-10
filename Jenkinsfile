podTemplate(cloud: 'kubernetes', 
    containers: [
        containerTemplate(args: 'cat', command: '/bin/sh -c', image: 'docker', name: 'docker-container', ttyEnabled: true),
        containerTemplate(args: 'cat', command: '/bin/sh -c', image: 'lachlanevenson/k8s-helm:latest', name: 'helm-container', ttyEnabled: true)
        ], 
    label: 'questcode', 
    namespace: 'devops', 
    volumes: [hostPathVolume(hostPath: '/var/run/docker.sock', mountPath: '/var/run/docker.sock')]
) 
{
    def REPOS
    def IMAGE_NAME = "questcode-backend-user"
    def IMAGE_POSFIX = ""
    def KUBE_NAMESPACE 
    def IMAGE_VERSION
    def GIT_BRANCH
    def HELM_CHART_NAME = "questcode/backend-user"
    def HELM_DEPLOY_NAME
    def CHARTMUSEUM_URL = "http://my-chartmuseum:8080"
    def NODE_PORT = "30020"

    node('questcode') {
        stage('Checkout') {
            echo 'Iniciando clone do repositório'
            REPOS = checkout scm
            GIT_BRANCH = REPOS.GIT_BRANCH
            if(GIT_BRANCH.equals("master")) {
                KUBE_NAMESPACE = "prod"
            } else if (GIT_BRANCH.equals("develop")) {
                KUBE_NAMESPACE = "staging"
                IMAGE_POSFIX = "-RC"
                NODE_PORT = "31020"
            } else {
                def error = "Não existe pipeline para a branch ${GIT_BRANCH}"
                echo error
                throw new Exception(error)
            }
            HELM_DEPLOY_NAME = KUBE_NAMESPACE + "-backend-user"
            IMAGE_VERSION = sh returnStdout: true, script: 'sh read-package-version.sh'
            IMAGE_VERSION = IMAGE_VERSION.trim() + IMAGE_POSFIX
        }
        stage('Package') {
            container('docker-container') {
                echo 'Iniciando empacotamento com o Docker'
                withCredentials([usernamePassword(credentialsId: 'dockerhub', passwordVariable: 'DOCKER_HUB_PASSWORD', usernameVariable: 'DOCKER_HUB_USER')]) {
                    sh "docker login -u ${DOCKER_HUB_USER} -p ${DOCKER_HUB_PASSWORD}"
                    sh "docker build -t ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_VERSION} ."
                    sh "docker push ${DOCKER_HUB_USER}/${IMAGE_NAME}:${IMAGE_VERSION}"
                }
            }
            
        }
        stage('Deploy') {
            container('helm-container'){
                echo 'Iniciando Deploy com Helm'
                sh 'ls -ltra'
                sh "helm repo add questcode ${CHARTMUSEUM_URL}"
                sh 'helm search repo questcode'
                sh 'helm repo update'
                try {
                    sh "helm upgrade ${HELM_DEPLOY_NAME} ${HELM_CHART_NAME} --set image.tag=${IMAGE_VERSION} -n ${KUBE_NAMESPACE} --set service.nodePort=${NODE_PORT}"
                } catch(Exception e) {
                    sh "helm install ${HELM_DEPLOY_NAME} ${HELM_CHART_NAME} -n ${KUBE_NAMESPACE} --set service.nodePort=${NODE_PORT}"
                }
            }
            
        }
    }
}
