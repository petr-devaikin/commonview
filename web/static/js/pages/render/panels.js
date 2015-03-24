define(['libs/d3'], function(d3) {
    var allPanels = d3.selectAll('.panel'),
        startPanel = d3.select('#startPanel'),
        loadingPanel = d3.select('#loadingPanel'),
        resumePanel = d3.select('#resumePanel'),
        processingPanel = d3.select('#processingPanel'),
        completePanel = d3.select('#completePanel'),
        interruptionPanel = d3.select('#interruptionPanel'),
        savingPanel = d3.select('#savingPanel');

    return {
        showStart: function() {
            allPanels.style('display', 'none');
            startPanel.style('display', 'block');
        },
        showLoading: function() {
            allPanels.style('display', 'none');
            loadingPanel.style('display', 'block');
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
        showSaving: function() {
            allPanels.style('display', 'none');
            savingPanel.style('display', 'block');
        },
    }
});