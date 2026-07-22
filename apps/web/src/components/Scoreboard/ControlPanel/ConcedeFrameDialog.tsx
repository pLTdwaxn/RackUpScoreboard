import { AlertDialog, Button } from "@heroui/react";

type ConcedeFrameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

const ConcedeFrameDialog = ({
  open,
  onOpenChange,
  onConfirm,
}: ConcedeFrameDialogProps) => {
  return (
    <AlertDialog isOpen={open} onOpenChange={onOpenChange}>
      <AlertDialog.Backdrop variant="opaque">
        <AlertDialog.Container>
          <AlertDialog.Dialog>
            <AlertDialog.Header>
              <AlertDialog.Heading>Conceding Frame</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              Are you sure you want to concede the frame?
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" onPress={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                Concede
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
};

export default ConcedeFrameDialog;
