import {Component, OnInit} from '@angular/core';
import {File, Entry} from '@ionic-native/file/ngx';
import {Platform, AlertController, ToastController} from '@ionic/angular';
import {FileOpener} from '@ionic-native/file-opener/ngx';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {
    directories = [];
    folder = '';
    copyFile: Entry = null;
    shouldMove = false;

    constructor(
        private file: File,
        private plt: Platform,
        private alertCtrl: AlertController,
        private fileOpener: FileOpener,
        private router: Router,
        private route: ActivatedRoute,
        private toastCtrl: ToastController
    ) {
    }

    ngOnInit() {
        this.folder = this.route.snapshot.paramMap.get('folder') || '';
        this.loadDocuments();
    }

    loadDocuments() {
        this.plt.ready().then(() => {
            // Reset for later copy/move operations
            this.copyFile = null;
            this.shouldMove = false;

            this.file.listDir(this.file.dataDirectory, this.folder).then(res => {
                this.directories = res;
            });
        });
    }

    async createFolder() {
        const alert = await this.alertCtrl.create({
            header: 'Create folder',
            message: 'Please specify the name of the new folder',
            inputs: [
                {
                    name: 'name',
                    type: 'text',
                    placeholder: 'MyDir'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                },
                {
                    text: 'Create',
                    handler: data => {
                        this.file
                            .createDir(
                                `${this.file.dataDirectory}/${this.folder}`,
                                data.name,
                                false
                            )
                            .then(() => {
                                this.loadDocuments();
                            });
                    }
                }
            ]
        });

        await alert.present();
    }

    async createFile() {
        const alert = await this.alertCtrl.create({
            header: 'Create file',
            message: 'Please specify the name of the new file',
            inputs: [
                {
                    name: 'name',
                    type: 'text',
                    placeholder: 'MyFile'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary'
                },
                {
                    text: 'Create',
                    handler: data => {
                        this.file
                            .writeFile(
                                `${this.file.dataDirectory}/${this.folder}`,
                                `${data.name}.txt`,
                                `My custom text - ${new Date().getTime()}`
                            )
                            .then(() => {
                                this.loadDocuments();
                            });
                    }
                }
            ]
        });

        await alert.present();
    }

    deleteFile(file: Entry) {
        const path = this.file.dataDirectory + this.folder;
        this.file.removeFile(path, file.name).then(() => {
            this.loadDocuments();
        });
    }

    startCopy(file: Entry, moveFile = false) {
        this.copyFile = file;
        this.shouldMove = moveFile;
    }

    async itemClicked(file: Entry) {
        if (this.copyFile) {
            // Copy is in action!
            if (!file.isDirectory) {
                const toast = await this.toastCtrl.create({
                    message: 'Please select a folder for your operation'
                });
                await toast.present();
                return;
            }
            // Finish the ongoing operation
            this.finishCopyFile(file);
        } else {
            // Open the file or folder
            if (file.isFile) {
               await this.fileOpener.open(file.nativeURL, 'text/plain');
            } else {
                const pathToOpen = this.folder !== '' ? this.folder + '/' + file.name : file.name;
                const folder = encodeURIComponent(pathToOpen);
                await this.router.navigateByUrl(`/home/${folder}`);
            }
        }
    }

    finishCopyFile(file: Entry) {
        const path = this.file.dataDirectory + this.folder;
        const newPath = this.file.dataDirectory + this.folder + '/' + file.name;

        if (this.shouldMove) {
            if (this.copyFile.isDirectory) {
                this.file
                    .moveDir(path, this.copyFile.name, newPath, this.copyFile.name)
                    .then(() => {
                        this.loadDocuments();
                    });
            } else {
                this.file
                    .moveFile(path, this.copyFile.name, newPath, this.copyFile.name)
                    .then(() => {
                        this.loadDocuments();
                    });
            }
        } else {
            if (this.copyFile.isDirectory) {
                this.file
                    .copyDir(path, this.copyFile.name, newPath, this.copyFile.name)
                    .then(() => {
                        this.loadDocuments();
                    });
            } else {
                this.file
                    .copyFile(path, this.copyFile.name, newPath, this.copyFile.name)
                    .then(() => {
                        this.loadDocuments();
                    });
            }
        }
    }
}
