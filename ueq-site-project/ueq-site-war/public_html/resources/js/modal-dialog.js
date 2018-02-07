function onModalVisiblePress(modal) {

    console.log("opening: " + modal);

    var modal = document.getElementById(modal);

    modal.classList.add('visible');
}

function onModalDismissPress(modal) {

    console.log("closing: " + modal);

    var modal = document.getElementById(modal);

    modal.classList.remove('visible');
}