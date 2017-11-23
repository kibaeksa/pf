const getValidHTMLString = str => {
    const dummyTextarea = document.createElement('textarea');
    dummyTextarea.innerHTML = str;
    return dummyTextarea.value;
};

const renderHTML = (selector , str) => {
    document.querySelector(selector).insertAdjacentHTML('beforeend',getValidHTMLString(str));
}
