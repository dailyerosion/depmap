//
$(document).ready(function(){
    init_ui();
    try {
        readWindowHash();
    } catch {
        // pass
    }
});
