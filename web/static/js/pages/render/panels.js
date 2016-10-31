define(['libs/d3'], function(d3) {
    var allPanels = d3.selectAll('.panel'),
        startPanel = d3.select('#startPanel'),
        resumePanel = d3.select('#resumePanel'),
        processingPanel = d3.select('#processingPanel'),
        completePanel = d3.select('#completePanel'),
        interruptionPanel = d3.select('#interruptionPanel');

    return {
        showStart: function() {
            allPanels.style('display', 'none');
            startPanel.style('display', 'block');
        },
        showResume: function() {
            allPanels.style('display', 'none');
            resumePanel.style('display', 'block');
        },
        showProcessing: function() {
            allPanels.style('display', 'none');
            processingPanel.style('display', 'block');
        },
        showComplete: function() {
            allPanels.style('display', 'none');
            completePanel.style('display', 'block');
        },
        showInterruption: function() {
            allPanels.style('display', 'none');
            interruptionPanel.style('display', 'block');
        },
    }
});
