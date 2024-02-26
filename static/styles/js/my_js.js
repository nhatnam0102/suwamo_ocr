// Function to set the active item in local storage
const setActiveItem = (index) => {
    localStorage.setItem("activeNavItem", index);
  };
  
  // Function to retrieve the active item from local storage
  const getActiveItem = () => {
    return localStorage.getItem("activeNavItem");
  };
  
  // Function to handle the click event on navigation items
  const handleNavItemClick = (navItem, index) => {
    navItem.click(() => {
      // Remove "active" class from all navigation items
      $(".nav-item").removeClass("active");
      
      // Add "active" class to the clicked navigation item
      navItem.addClass("active");
  
      // Set the active item in local storage
      setActiveItem(index);
    });
  };
  
  // Check if there is an active item in local storage and apply the active class
  const activeIndex = getActiveItem();
  if (activeIndex !== null) {
    // Remove "active" class from all navigation items
    $(".nav-item").removeClass("active");
  
    // Add "active" class to the stored active item
    $(".nav-item").eq(activeIndex).addClass("active");
  }
  
  // Attach click event listeners to navigation items
  $(".nav-item").each((index, navItem) => {
    handleNavItemClick($(navItem), index);
  });