class UserDTO {
    constructor(user) {
        this._id = user._id;
        this.name = user.name;
        this.email = user.email;
        this.role = user.role;
        this.isActive = user.isActive;
        this.isAdmin = user.role === 'admin';
        this.token = user.token; // Optional, added if generated
    }
}

export default UserDTO;
