function switchTo(input) {
    tools = [Math,
        explain,
        essay,
        diagram,
        compound,
        balancer,
        graph,
        notes,
        audio,
        simplifier,
        quiz,
        syllabus,
        project]

    tools.forEach(t => {
        document.getElementById('panel-' + t).style.display = t === val ? 'block' : 'none';
    });
}