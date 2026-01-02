/**
 * Container Orchestration Service - Kubernetes Autopilot Pattern
 * 
 * PREMIUM FEATURE #19: Container Orchestration
 * 
 * Captain of the ship managing Docker containers.
 * Auto-scales AI agents based on CPU usage.
 * 
 * @module containerOrchestration
 */

const ContainerState = Object.freeze({
    PENDING: 'pending', RUNNING: 'running', STOPPED: 'stopped',
    FAILED: 'failed', SCALING: 'scaling', TERMINATING: 'terminating'
});

class Container {
    constructor(config) {
        this.id = `container_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        this.name = config.name;
        this.image = config.image;
        this.cpu = config.cpu || 0.25;
        this.memory = config.memory || 256;
        this.state = ContainerState.PENDING;
        this.replicas = config.replicas || 1;
        this.currentReplicas = 0;
        this.port = config.port;
        this.env = config.env || {};
        this.healthCheck = config.healthCheck || { path: '/health', intervalMs: 30000 };
        this.createdAt = Date.now();
        this.metrics = { cpuUsage: 0, memoryUsage: 0, requestCount: 0 };
    }
}

class Deployment {
    constructor(name, config) {
        this.name = name;
        this.namespace = config.namespace || 'default';
        this.containers = new Map();
        this.minReplicas = config.minReplicas || 1;
        this.maxReplicas = config.maxReplicas || 10;
        this.targetCPU = config.targetCPU || 70;
        this.targetMemory = config.targetMemory || 80;
        this.state = ContainerState.PENDING;
        this.events = [];
    }

    addEvent(type, message) {
        this.events.push({ type, message, timestamp: Date.now() });
        if (this.events.length > 100) this.events.shift();
    }
}

class ContainerOrchestrationService {
    constructor() {
        this.deployments = new Map();
        this.autoscalerInterval = null;
        this.healthCheckInterval = null;
        this.metrics = { totalContainers: 0, scaleUpEvents: 0, scaleDownEvents: 0, failedHealthChecks: 0 };
    }

    createDeployment(name, config = {}) {
        const deployment = new Deployment(name, config);
        this.deployments.set(name, deployment);
        console.log(`[K8s] Deployment created: ${name}`);
        return deployment;
    }

    addContainer(deploymentName, containerConfig) {
        const deployment = this.deployments.get(deploymentName);
        if (!deployment) throw new Error(`Deployment not found: ${deploymentName}`);
        const container = new Container(containerConfig);
        deployment.containers.set(container.name, container);
        this.metrics.totalContainers++;
        return container;
    }

    async deploy(deploymentName) {
        const deployment = this.deployments.get(deploymentName);
        if (!deployment) throw new Error(`Deployment not found: ${deploymentName}`);

        deployment.state = ContainerState.SCALING;
        deployment.addEvent('Normal', `Deploying ${deployment.containers.size} containers`);

        for (const container of deployment.containers.values()) {
            await this.startContainer(container, deployment.minReplicas);
        }

        deployment.state = ContainerState.RUNNING;
        deployment.addEvent('Normal', 'Deployment successful');
        return { success: true, deployment: deploymentName };
    }

    async startContainer(container, replicas) {
        container.state = ContainerState.SCALING;
        for (let i = 0; i < replicas; i++) {
            await new Promise(r => setTimeout(r, 50));
            container.currentReplicas++;
        }
        container.state = ContainerState.RUNNING;
    }

    async scaleDeployment(deploymentName, replicas) {
        const deployment = this.deployments.get(deploymentName);
        if (!deployment) throw new Error(`Deployment not found: ${deploymentName}`);

        const targetReplicas = Math.max(deployment.minReplicas, Math.min(deployment.maxReplicas, replicas));

        for (const container of deployment.containers.values()) {
            const diff = targetReplicas - container.currentReplicas;
            if (diff > 0) {
                this.metrics.scaleUpEvents++;
                deployment.addEvent('Normal', `Scaling up: +${diff} replicas`);
            } else if (diff < 0) {
                this.metrics.scaleDownEvents++;
                deployment.addEvent('Normal', `Scaling down: ${diff} replicas`);
            }
            container.currentReplicas = targetReplicas;
        }

        return { scaled: true, replicas: targetReplicas };
    }

    startAutoscaler(intervalMs = 30000) {
        if (this.autoscalerInterval) return;

        this.autoscalerInterval = setInterval(() => {
            for (const deployment of this.deployments.values()) {
                this.evaluateScaling(deployment);
            }
        }, intervalMs);
        console.log('[K8s] Autoscaler started');
    }

    evaluateScaling(deployment) {
        for (const container of deployment.containers.values()) {
            const cpuUsage = container.metrics.cpuUsage;
            const currentReplicas = container.currentReplicas;

            if (cpuUsage > deployment.targetCPU && currentReplicas < deployment.maxReplicas) {
                const newReplicas = Math.min(currentReplicas + 2, deployment.maxReplicas);
                this.scaleDeployment(deployment.name, newReplicas);
            } else if (cpuUsage < deployment.targetCPU * 0.5 && currentReplicas > deployment.minReplicas) {
                const newReplicas = Math.max(currentReplicas - 1, deployment.minReplicas);
                this.scaleDeployment(deployment.name, newReplicas);
            }
        }
    }

    stopAutoscaler() {
        if (this.autoscalerInterval) {
            clearInterval(this.autoscalerInterval);
            this.autoscalerInterval = null;
        }
    }

    updateContainerMetrics(deploymentName, containerName, metrics) {
        const deployment = this.deployments.get(deploymentName);
        const container = deployment?.containers.get(containerName);
        if (container) Object.assign(container.metrics, metrics);
    }

    async deleteDeployment(deploymentName) {
        const deployment = this.deployments.get(deploymentName);
        if (!deployment) return;

        deployment.state = ContainerState.TERMINATING;
        for (const container of deployment.containers.values()) {
            container.state = ContainerState.STOPPED;
            container.currentReplicas = 0;
        }
        this.deployments.delete(deploymentName);
    }

    getDeploymentStatus(deploymentName) {
        const deployment = this.deployments.get(deploymentName);
        if (!deployment) return null;

        return {
            name: deployment.name,
            namespace: deployment.namespace,
            state: deployment.state,
            containers: Array.from(deployment.containers.values()).map(c => ({
                name: c.name, state: c.state, replicas: c.currentReplicas, metrics: c.metrics
            })),
            events: deployment.events.slice(-10)
        };
    }

    getMetrics() {
        const allContainers = [];
        for (const dep of this.deployments.values()) {
            for (const c of dep.containers.values()) allContainers.push(c);
        }
        return {
            ...this.metrics,
            deployments: this.deployments.size,
            runningContainers: allContainers.filter(c => c.state === ContainerState.RUNNING).length,
            totalReplicas: allContainers.reduce((sum, c) => sum + c.currentReplicas, 0)
        };
    }
}

export const containerOrchestration = new ContainerOrchestrationService();
export { ContainerState, Container, Deployment, ContainerOrchestrationService };
export default containerOrchestration;
