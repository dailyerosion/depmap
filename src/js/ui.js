// User Interface Stuff

function init_ui(){
    // One time stuff
    $("#drawer_handle").click(function(){
        $("#buttontabs .btn").removeClass('active');
        $('.row-offcanvas').toggleClass("active");
    });

    $('#myTabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });
}
