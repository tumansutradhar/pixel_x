import React from 'react';

function Footer() {
    const year = new Date().getFullYear();

    return (
        <p className="text-zinc-600 text-center text-[10px] sm:text-[15px]">
            Copyright © {year}{" "}
            <a href="https://github.com/tumansutradhar" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                Tuman Sutradhar
            </a>, PixelX. All rights reserved.
        </p>
    );
}

export default Footer;
